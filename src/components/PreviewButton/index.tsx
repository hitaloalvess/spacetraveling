import Link from 'next/link'

import styles from './styles.module.scss';

export default function PreviewButton(){

    return(
        <aside className={styles.previewButtonContainer}>
            <Link href='/api/exit-preview'>
                <a>
                    Sair do modo Preview
                </a>
            </Link>
        </aside>
    )
}