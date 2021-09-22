
import styles from './styles.module.scss';

interface ButtonLoadMoreProps{
    loadMorePosts: () => void;
    nextPage: RequestInfo;
}

export default function ButtonLoadMore({ loadMorePosts, nextPage } : ButtonLoadMoreProps){

    if(!nextPage) return null;

    return (
        <button
            className={styles.btnLoadMore}
            onClick={() => loadMorePosts()}
        >
            Carregar mais posts
        </button>
    )
}