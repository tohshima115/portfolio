import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a className={styles.logo} href="#"></a>
        <div className={styles.title}>
          <a className={styles.left} href='#'>豊</a>
          <a href='#'>島</a>
          <a className={styles.right} href='#'>豊</a>
        </div>
      </div>
      <div className={styles.border_top}></div>
      <div className={styles.border_bot}></div>
    </header>
  );
}