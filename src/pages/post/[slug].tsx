import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

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
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
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
  readingTimePost: number;
}

export default function Post( { post, readingTimePost } : PostProps) {
  const router = useRouter()

  if(router.isFallback){
      return <h1>Carregando...</h1>
  }
  
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
                {post.first_publication_date}
              </div>

              <div >
                <FaUser />
                  {post.data.author}
              </div>

              <div >
                <FaClock />
                {readingTimePost}min aprox.
              </div>
            </div>

            {
              post.data.content.map( (item, index) => (
                <article 
                  key={index}
                  className={styles.postBody}
                >
                  <h2>{item.heading}</h2>
                  <div dangerouslySetInnerHTML={{__html:String(item.body)}}></div>
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
      // ...params
      {params: {slug:'novas-features-javascript'}},
    ],
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({params}) => {

  const { slug } = params
  
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});


  function calculateReadingTimePost(){
      const wordPerMinute = 200;

      const numberWords = response.data.content.reduce( (acc : String[], item: ContentProps) => {
        const wordsHeading = item.heading.split(' ');
        const wordsBody = RichText.asText([...item.body]).split(' ');
          acc.push(...wordsHeading, ...wordsBody)
          return acc
      }, [])

     const readingTime = Math.ceil( numberWords.length/ wordPerMinute);

     return readingTime;
  }
  
  const content = response.data.content.map( item => {
    return {
      heading: item.heading,
      body: RichText.asHtml([...item.body])
    }
  })

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      "dd MMM yyyy",
      {
        locale: ptBR,
      }
    ),
    data:{
      title: response.data.title,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: content
    }
  }

  return{
    props:{
      post,
      readingTimePost : calculateReadingTimePost()
    }
  }
};
