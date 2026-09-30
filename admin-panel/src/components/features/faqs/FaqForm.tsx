import { useState, useEffect } from 'react';
import { Faq } from '@/types';
import { Input, Checkbox, Button } from '@/components/ui';

interface FaqFormProps {
  faq?: Faq | null;
  onSubmit: (data: Omit<Faq, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function FaqForm({ faq, onSubmit, onCancel, loading }: FaqFormProps) {
  const [lang, setLang] = useState<'en' | 'sv'>('en');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    questionSv: '',
    answerSv: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        questionSv: faq.questionSv || '',
        answerSv: faq.answerSv || '',
        order: faq.order,
        isActive: faq.isActive,
      });
    }
  }, [faq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            lang === 'en'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLang('sv')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            lang === 'sv'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Svenska
        </button>
      </div>

      {lang === 'en' ? (
        <>
          <Input
            label="Question"
            required
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          />
          <Input
            as="textarea"
            label="Answer"
            required
            rows={5}
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          />
        </>
      ) : (
        <>
          <Input
            label="Fråga (Question)"
            helperText="Lämna tomt för att falla tillbaka på engelska"
            value={formData.questionSv}
            onChange={(e) => setFormData({ ...formData, questionSv: e.target.value })}
          />
          <Input
            as="textarea"
            label="Svar (Answer)"
            rows={5}
            value={formData.answerSv}
            onChange={(e) => setFormData({ ...formData, answerSv: e.target.value })}
          />
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Display Order"
          type="number"
          helperText="Lower numbers appear first on the FAQ page"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
        />
        <div className="flex items-end pb-2">
          <Checkbox
            label="Visible on website"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
