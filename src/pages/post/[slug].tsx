import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import ErrorPage from 'next/error'

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FaCalendar, FaUser, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/router';


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
}

export default function Post( { post } : PostProps) {
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
  
   console.log(readingTime)
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

  const { slug } = params
  
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});
 
   try{
    const content = response.data.content.map( item => {
      return {
        heading: item.heading,
        body: [...item.body]//RichText.asHtml([...item.body])
        
        // body: [...item.body]
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
  
    return{
      props:{
        post
      }
    }
   } catch(error){
      return {
        props:{}
      }
   }

};
