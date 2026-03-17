import styles from './title.module.css';

interface TitleProps {
  content?: string;
  type?: 'plain' | 'flag';
  flagColor?: string;
}

export const Title: React.FC<TitleProps> = ({
  content,
  type = 'flag',
  flagColor = '#008ffa',
}: TitleProps) => {
  if (type === 'plain') {
    return <h3 className={styles.plain}>{content}</h3>;
  }
  if (type === 'flag') {
    return (
      <div
        className={styles.flagContainer}
        style={{ '--flag-color': flagColor } as React.CSSProperties}
      >
        <div className={styles.flagMarker}></div>
        <div className={styles.flagContent}>{content}</div>
      </div>
    );
  }
  return null;
};
