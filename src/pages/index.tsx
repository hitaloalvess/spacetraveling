import { useState } from 'react';

import Link from 'next/link'
import Head from 'next/head';

import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'

import { FaUser, FaCalendar } from 'react-icons/fa'
import ButtonLoadMore from '../components/ButtonLoadMore';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import PreviewButton from '../components/PreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home( { postsPagination, preview } : HomeProps ) {
  
  const [nextPage, setNextPage] = useState<RequestInfo>(postsPagination.next_page)
  const [posts, setPosts] = useState<Post[]>(
    [...postsPagination.results]
  )

  async function loadMorePosts() : Promise<void>{
    const response = await fetch(nextPage);
    const data = await response.json();

    setPosts([
      ...posts, ...data.results
    ]);
    setNextPage( data.next_page);
  }

  return (
    <>
      <Head>
        <title>Ínicio | spacetraveling</title>
      </Head>
       <main className={commonStyles.container}>
           <div className={`${styles.postsContent} ${commonStyles.content}`}>
             {
               posts.map( post => {
                 return(
                   <Link href={`/post/${post.uid}`} key={post.uid}>
                      <a className={styles.post}>
                        <h1>{post.data.title}</h1>
                          <p>{post.data.subtitle}</p>
                          <div className={commonStyles.postInfo}>
                            <div>
                                <span>
                                  <FaCalendar />
                                    {
                                      format(
                                        new Date(post.first_publication_date),
                                        "dd MMM yyyy",
                                        {
                                          locale: ptBR,
                                        }
                                      )
                                    }
                                </span>

                                <span>
                                  <FaUser />
                                    {post.data.author}
                                </span>
                            </div>
                          </div>
                      </a>
                   </Link>
                 )
               })
             }
             <ButtonLoadMore
                loadMorePosts={() => loadMorePosts()}
                nextPage={nextPage}
             />

            {
               preview && <PreviewButton />
            }
           </div>
       </main>
    </>
   )      
      
  
}

export const getStaticProps: GetStaticProps = async ({ preview = false, previewData}) => {
  const prismic = getPrismicClient();
  
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
      {
        fetch:['posts.title', 'posts.subtitle', 'posts.author', 'posts.banner','posts.content'],
        pageSize: 1,
        ref: previewData?.ref ?? null
      }
  );

  const nextPage = postsResponse.next_page;
  const posts = postsResponse.results.map( post => {
    return {
     uid: post.uid,
     first_publication_date: post.first_publication_date, 
     data:{
       title: post.data.title,
       subtitle: post.data.subtitle,
       author: post.data.author
     }

    }
  });

    return{
      props:{
        postsPagination:{
          next_page: nextPage,
          results: posts
        },
        preview
      },
      revalidate: 60 * 60 * 24, // 24 horas
    }
}
