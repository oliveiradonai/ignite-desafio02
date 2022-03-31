import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const product = await api.get('products/' + productId);

      if (product === null || product === undefined) {
        toast.error('Erro na adição do produto');
        return;
      }

      const stock = await api.get('stock/' + productId);
      const newCart = product.data;
      const finalCart = {
        id: productId,
        title: newCart.title,
        price: newCart.price,
        image: newCart.image,
        amount: 1,
      }

      if (cart === []) {
        setCart([
          finalCart
        ]);
      }
      else {
        const productExistsInCart = cart.find(c => c.id === productId)
        const amount = productExistsInCart ? productExistsInCart.amount : 0;
        const newAmount = amount + 1;

        const inStock = stock.data.amount;

        if (newAmount > inStock) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        if (productExistsInCart) {
          updateProductAmount({
            productId: productId,
            amount: newAmount
          });
        }
        else {
          setCart(oldCart => [
            ...oldCart,
            finalCart
          ]);
        }
      };
    }
    catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    
    const product = await api.get('products/' + productId);

    if (product === null || product === undefined) {
      toast.error('Erro na adição do produto');
      return;
    }
    try {

      const productExists = cart.find(c => c.id === productId)
      if (!productExists) {
        toast.error('Erro na remoção do produto');
        return;
      }

      setCart(cart.filter(c => c.id !== productId))
    }
    catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    const product = await api.get('products/' + productId);

    if (product === null || product === undefined) {
      toast.error('Erro na adição do produto');
      return;
    }
    try {

      if (amount <= 0) {
        return;
      }

      const productExists = cart.find(c => c.id === productId)
      if (!productExists) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const stock = await api.get('stock/' + productId);
      const inStock = stock.data.amount;
      if (amount > inStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      setCart(
        cart.map(product =>
          product.id === productId
            ? { ...product, amount: amount }
            : product
        )
      )
    }
    catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
