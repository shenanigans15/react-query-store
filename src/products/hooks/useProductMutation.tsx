import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productActions } from '..'
import { ProductLike } from '../services/actions'

export const useProductMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: productActions.createProduct,

    onMutate: (product) => {
      console.log('Mutando - Optimistic update')

      // Optimistic Product
      const optimisticProduct = { id: Math.random(), ...product }

      // Almacenar el producto en el cache del query client
      queryClient.setQueryData<ProductLike[]>(
        ['products', { filterKey: product.category }],
        (old) => {
          if (!old) return [optimisticProduct]

          return [...old, optimisticProduct]
        },
      )

      return {
        optimisticProduct,
      }
    },

    onSuccess: (product, variables, context) => {
      // queryClient.invalidateQueries({
      //   queryKey: ['products', { filterKey: data.category }],
      // })
      queryClient.removeQueries({
        queryKey: ['product', context?.optimisticProduct.id],
      })

      queryClient.setQueryData<ProductLike[]>(
        ['products', { filterKey: product.category }],
        (old) => {
          if (!old) return [product]

          return old.map((cacheProduct) => {
            return cacheProduct.id === context?.optimisticProduct.id
              ? product
              : cacheProduct
          })
        },
      )
    },

    onError: (error, variables, context) => {
      queryClient.removeQueries({
        queryKey: ['product', context?.optimisticProduct.id],
      })

      queryClient.setQueryData<ProductLike[]>(
        ['products', { filterKey: variables.category }],
        (old) => {
          if (!old) return []

          return old.filter((cacheProduct) => {
            return cacheProduct.id !== context?.optimisticProduct.id
          })
        },
      )
    },
  })

  return mutation
}
