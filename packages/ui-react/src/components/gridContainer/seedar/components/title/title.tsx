import styles from './title.module.css';

interface TitleProps {
  content?: string;
  type?: 'plain' | 'flag';
}

export const Title: React.FC<TitleProps> = ({
  content,
  type = 'flag',
}: TitleProps) => {
  if (type === 'plain') {
    return <h3 className={styles.plain}>{content}</h3>;
  }
  if (type === 'flag') {
    return (
      <div className={styles.flagContainer}>
        <div className={styles.flagMarker}></div>
        <div className={styles.flagContent}>{content}</div>
      </div>
    );
  }
  return null;
};
