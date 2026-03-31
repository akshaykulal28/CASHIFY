import { createContext, useState, useEffect } from 'react'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : [])

  const getItemKey = (item) => item?._id || item?.id;

  const addToCart = (item) => {
    const itemKey = getItemKey(item);
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
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
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
    const cartItems = localStorage.getItem("cartItems");
    if (cartItems) {
      setCartItems(JSON.parse(cartItems));
    }
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
