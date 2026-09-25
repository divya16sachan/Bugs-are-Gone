"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "./order-api";
import { CreateOrderInput, OrderResponse } from "./types";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<OrderResponse, Error, CreateOrderInput>({
    mutationFn: (input: CreateOrderInput) => orderApi.createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
