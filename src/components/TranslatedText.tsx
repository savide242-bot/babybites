import { memo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';

interface Props {
  tkey: string;
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Renders text translated to active language (cached on backend).
 * In English: shows original instantly. In Spanish: shows original then swaps in.
 */
const TranslatedText = memo(({ tkey, text, as: Tag = 'span', className }: Props) => {
  const { language } = useLanguage();
  const items = language === 'en' ? [] : [{ key: tkey, text }];
  const { map } = useTranslatedContent(items);
  const display = language === 'en' ? text : (map[tkey] || text);
  return <Tag className={className}>{display}</Tag>;
});
TranslatedText.displayName = 'TranslatedText';

export default TranslatedText;
