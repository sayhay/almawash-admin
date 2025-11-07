export const formatDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });
    return formatter.format(date);
  } catch (error) {
    return value;
  }
};

export const formatCurrency = (amount?: number | null, currency: string = 'EUR') => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatPhone = (phone?: string | null) => {
  if (!phone) return '—';
  return phone.replace(/(\d{2})(?=\d)/g, '$1 ');
};
