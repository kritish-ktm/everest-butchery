export function customerProfile(user) {
  const data = user?.user_metadata || {};
  return {
    full_name: data.full_name || data.name || "",
    email: user?.email || "",
    phone: data.phone || data.phone_number || user?.phone || "",
    address: data.address || "",
    postal_code: data.postal_code || "",
    city: data.city || "",
  };
}
