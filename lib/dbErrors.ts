/** Turn a raw Postgres/Supabase error into a user-friendly { message, status } pair. */
export function friendlyDbError(error: any): { message: string; status: number } {
  if (error?.code === '23505') {
    const detail: string = error.message || error.details || '';
    if (detail.includes('customers_phone_key')) {
      return { message: 'This phone number is already registered to another customer. Phone numbers must be unique.', status: 409 };
    }
    if (detail.includes('_email_key') || detail.includes('email')) {
      return { message: 'This email address is already in use.', status: 409 };
    }
    return { message: 'This record already exists.', status: 409 };
  }
  return { message: error?.message || 'Something went wrong', status: 500 };
}
