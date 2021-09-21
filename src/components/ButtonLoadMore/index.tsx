
interface ButtonLoadMoreProps{
    loadMorePosts: () => void;
    nextPage: string;
}

export default function ButtonLoadMore({ loadMorePosts, nextPage } : ButtonLoadMoreProps){

    if(!nextPage) return null;

    return (
        <button
            onClick={() => loadMorePosts()}
        >
            Carregar mais posts...
        </button>
    )
}