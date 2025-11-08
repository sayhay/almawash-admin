export const formatDate = (value?: string | number | Date | null, options?: Intl.DateTimeFormatOptions) => {
  if (value == null) {
    return '—';
  }

  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return typeof value === 'string' ? value : '—';
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
    return typeof value === 'string' ? value : '—';
  }
};

export const formatCurrency = (
  amount?: number | null,
  currency: string = 'EUR',
  options?: Intl.NumberFormatOptions,
) => {
  if (amount == null) {
    return '—';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
};

export const formatCurrencyEUR = (amount?: number | null, options?: Intl.NumberFormatOptions) =>
  formatCurrency(amount, 'EUR', options);

export const formatPhone = (phone?: string | null) => {
  if (!phone) {
    return '—';
  }

  return phone.replace(/(\d{2})(?=\d)/g, '$1 ');
};
