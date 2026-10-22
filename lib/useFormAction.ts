"use client";

import { type FormEvent, startTransition, useActionState } from "react";

type Result = { ok?: boolean; error?: string; message?: string };

/**
 * Like useActionState for a <form>, but the form is only reset on success.
 * (React resets forms after every `action` submit, which wipes input on errors.)
 */
export function useFormAction(
  action: (prev: Result, formData: FormData) => Promise<Result>,
  onSuccess?: () => void,
) {
  const [state, dispatch, pending] = useActionState(
    async (prev: Result, { form, data }: { form: HTMLFormElement; data: FormData }) => {
      const result = await action(prev, data);
      if (result.ok) {
        form.reset();
        onSuccess?.();
      }
      return result;
    },
    {} as Result,
  );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    startTransition(() => dispatch({ form, data: new FormData(form) }));
  };

  return { state, onSubmit, pending };
}
