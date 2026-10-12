export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  size: string;
  color: string;
  quantity: number;
};

const KEY = "imarax-cart";
const EVENT = "imarax-cart-updated";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage unavailable, ignore
  }

  window.dispatchEvent(new Event(EVENT));
}

function same(a: CartItem, productId: string, size: string, color: string) {
  return a.productId === productId && a.size === size && a.color === color;
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existing = cart.find((i) => same(i, item.productId, item.size, item.color));

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }

  save(cart);
}

export function updateQuantity(
  productId: string,
  size: string,
  color: string,
  quantity: number
) {
  const cart = getCart()
    .map((i) => (same(i, productId, size, color) ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);

  save(cart);
}

export function removeFromCart(productId: string, size: string, color: string) {
  save(getCart().filter((i) => !same(i, productId, size, color)));
}

export function clearCart() {
  save([]);
}

export function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export const CART_EVENT = EVENT;