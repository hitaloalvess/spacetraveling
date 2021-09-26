import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import ErrorPage from 'next/error'
import Link from 'next/link'

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FaCalendar, FaUser, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/router';
import Comments from '../../components/Comments';
import PreviewButton from '../../components/PreviewButton';


interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    author: string;
    banner: {
      url: string;
    };
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
    title: string;
    subtitle: string;
  };
}

interface ContentProps{
  heading: string;
    body: {
      text: string;
    }[];
}

interface ButtonNavigationProps{
  uid:string;
  data:{
    title:string;
  }
}

interface PostProps {
  post: Post;
  prevPost: ButtonNavigationProps;
  nextPost: ButtonNavigationProps;
  preview: boolean;
}

export default function Post( { post, prevPost, nextPost, preview } : PostProps) {

  const router = useRouter()

  if(!post){
    return <ErrorPage statusCode={404} />
  }
  
  if(router.isFallback){
      return <h1>Carregando...</h1>
  }

  function calculateReadingTimePost(response: Post){
    const wordPerMinute = 200;

    const numberWords = response.data.content.reduce( (acc : String[], item: ContentProps) => {
      const wordsHeading = item.heading.split(' ');
      const wordsBody = RichText.asText([...item.body]).split(' ');
        acc.push(...wordsHeading, ...wordsBody)
        return acc
    }, [])

   const readingTime = Math.ceil( numberWords.length/ wordPerMinute);
  
   return `${readingTime} min`;
  }

  const postHasBeenEdited = post.first_publication_date !== post.last_publication_date;
    return(
      <>
        <Head>
          <title>Post | {post.data.title}</title>
        </Head>

        <img className={styles.logo} src={post.data.banner.url} alt="logo" />
        <main className={`${styles.postContainer} ${commonStyles.container}`}>
          <section className={commonStyles.content}>
            <h1>{post.data.title}</h1>
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

                  <span>
                    <FaClock />
                    {calculateReadingTimePost(post)}
                  </span>
              </div>

              <div>
                  <span className={commonStyles.postEdit}>
                  {
                      postHasBeenEdited &&
                      format(
                        new Date(post.last_publication_date),
                        "'* editado em 'dd MMM yyyy, HH:mm",
                        {
                          locale: ptBR,
                        }
                      )   
                  }
                  </span>
              </div>
            </div>

            {
              post.data.content.map( (item, index) => (
                <article 
                  key={index}
                  className={styles.postBody}
                >
                  <h2>{item.heading}</h2>
                  <div dangerouslySetInnerHTML={
                      {
                        __html:RichText.asHtml([...item.body])
                      }
                    }>
                  </div>
                </article>
              ))
            }  
            
            <div className={styles.prevNextPost}>  
                    {
                      prevPost && 
                      <div>
                        <p>{prevPost.data.title}</p>
                        <Link href={`/post/${prevPost.uid}`}>
                          <a>
                            Post anterior
                          </a>
                        </Link>
                      </div>
                    }

                    {
                      nextPost && 
                      <div>
                        <p>{nextPost.data.title}</p>
                        <Link href={`/post/${nextPost.uid}`}>
                          <a>
                            Próximo post
                          </a>
                        </Link>
                      </div>
                    }

            </div>

            <Comments />
            
            {preview && <PreviewButton />}
          </section>
        </main>
      </>
  );
  
}

export const getStaticPaths : GetStaticPaths = async () => {

  const prismic = getPrismicClient();
  const response = await prismic.query(
    [ Prismic.predicates.at('document.type', 'posts')],
    {
      fetch:[],
      pageSize: 3
    }
  );
  
  const params = response.results.reduce( (acc, item) => {
    acc.push({params: {slug: item.uid}}) 
    return acc;
  }, [])

  return{
    paths:[
      ...params
    ],
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({params, preview=false, previewData}) => {
  try{
  
    const { slug } = params
    const prismic = getPrismicClient();
    const response = await prismic.getByUID('posts', String(slug), {
      ref: previewData?.ref ?? null
    });
  
    const nextResponse = await prismic.query(
      Prismic.predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        after: response?.id,
        orderings: '[document.first_publication_date desc]',
        ref: previewData?.ref ?? null
      }
    )

    const prevResponse = await prismic.query(
      Prismic.predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        after: response?.id,
        orderings: '[document.first_publication_date]',
        ref: previewData?.ref ?? null
      }
    )
    
    const content = response.data.content.map( item => {
      return {
        heading: item.heading,
        body: [...item.body]
        
      }
    })
    
    const post = {
      uid: response.uid,
      first_publication_date: response.first_publication_date,
      last_publication_date: response.last_publication_date,
      data:{
        author: response.data.author,
        banner: {
          url: response.data.banner.url
        },
        content: [
          ...content,
        ],
        subtitle: response.data.subtitle,
        title: response.data.title
      }
    }
    
    const prevPost = prevResponse?.results[0] || null;
    const nextPost = nextResponse?.results[0] || null; 
    
    return{
      props:{
        post,
        prevPost,
        nextPost,
        preview
      }
    }
   } catch(error){
     return {
        props:{}
      }
   }

};
