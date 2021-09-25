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


interface Post {
  uid: string;
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
  prevPost: Post;
  nextPost: Post;
}

export default function Post( { post, prevPost, nextPost } : PostProps) {
  const router = useRouter()

  if(!post){
    return <ErrorPage statusCode={404} />
  }

  if(router.isFallback){
      return <h1>Carregando...</h1>
  }

  function calculateReadingTimePost(response){
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
  
  const time = calculateReadingTimePost(post)
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
              </div>

              <div >
                <FaUser />
                  {post.data.author}
              </div>

              <div >
                <FaClock />
                {time}
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

export const getStaticProps: GetStaticProps = async ({params}) => {
  try{
  
    const { slug } = params
    const prismic = getPrismicClient();
    const response = await prismic.getByUID('posts', String(slug), {});
  
    const nextResponse = await prismic.query(
      Prismic.predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        after: response?.id,
        orderings: '[document.first_publication_date desc]'
      }
    )

    const prevResponse = await prismic.query(
      Prismic.predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        after: response?.id,
        orderings: '[document.first_publication_date]'
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
      }
    }
   } catch(error){
     return {
        props:{}
      }
   }

};
