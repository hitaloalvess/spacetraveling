import Link from 'next/link'

import styles from './header.module.scss'
import commonStyles from '../../styles/common.module.scss'

export default function Header() {
  return(
    <header className={styles.header}>
      <div className={`${styles.logo} ${commonStyles.container} `}>
        <Link href="/"> 
            <a className={commonStyles.content}>
                <img src="/images/logo.svg" alt="logo" />
            </a>
        </Link>
      </div>
    </header>
  )
}
