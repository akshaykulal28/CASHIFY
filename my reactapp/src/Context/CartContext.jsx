import { createContext, useState, useEffect } from 'react'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const normalizeCartItem = (item) => {
    if (!item || typeof item !== 'object') return null;

    const imageUrl = item.imageUrl || item.ImageUrl || item.ImageURL || '';
    const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;

    return {
      ...item,
      imageUrl,
      quantity,
    };
  };

  const readStoredCartItems = () => {
    try {
      const storedItems = localStorage.getItem('cartItems');
      if (!storedItems) return [];

      const parsed = JSON.parse(storedItems);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map(normalizeCartItem)
        .filter((item) => item && (item._id || item.id));
    } catch {
      return [];
    }
  };

  const [cartItems, setCartItems] = useState(readStoredCartItems)

  const getItemKey = (item) => item?._id || item?.id;

  const addToCart = (item) => {
    const normalizedItem = normalizeCartItem(item);
    const itemKey = getItemKey(normalizedItem);
    if (!itemKey) return;

    const isItemInCart = cartItems.find((cartItem) => getItemKey(cartItem) === itemKey);

    if (isItemInCart) {
      setCartItems(
        cartItems.map((cartItem) =>
          getItemKey(cartItem) === itemKey
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCartItems([...cartItems, normalizedItem]);
    }
  };

  const removeFromCart = (item) => {
    const itemKey = getItemKey(item);
    if (!itemKey) return;

    const isItemInCart = cartItems.find((cartItem) => getItemKey(cartItem) === itemKey);
    if (!isItemInCart) return;

    if (isItemInCart.quantity === 1) {
      setCartItems(cartItems.filter((cartItem) => getItemKey(cartItem) !== itemKey));
    } else {
      setCartItems(
        cartItems.map((cartItem) =>
          getItemKey(cartItem) === itemKey
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    setCartItems(readStoredCartItems());
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
