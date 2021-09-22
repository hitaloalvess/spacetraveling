import { GetStaticPaths, GetStaticProps } from 'next';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FaCalendar, FaUser } from 'react-icons/fa';

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

  console.log(post)

  return(
    <h1>Post</h1>
      // <main className={commonStyles.container}>
      //   <img src={post.data.banner.url} alt="logo" />
      //   <section className={commonStyles.content}>
      //     <h1>{post.data.title}</h1>
      //     <div>
      //       <div>
      //         <FaCalendar />
      //         {}
      //       </div>

      //       <div >
      //         <FaUser />
      //           {post.data.author}
      //       </div>
      //     </div>

      //     <article>{post.data.content.heading}</article>
      //   </section>
      // </main>
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
