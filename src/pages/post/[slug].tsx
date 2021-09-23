import { GetStaticPaths, GetStaticProps } from 'next';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FaCalendar, FaUser, FaClock } from 'react-icons/fa';

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

interface PostProps {
  post: Post;
}

export default function Post( { post } : PostProps) {

  return(
      <>
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
                  4min
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

  return{
    paths:[],
    fallback: 'blocking',
  }
};

export const getStaticProps: GetStaticProps = async ({params}) => {

  const { slug } = params
  console.log(slug)
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

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
      post
    }
  }
};
