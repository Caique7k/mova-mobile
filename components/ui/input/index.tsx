'use client';
import React from 'react';
import { createInput } from '@gluestack-ui/core/input/creator';
import { PrimitiveIcon, UIIcon } from '@gluestack-ui/core/icon/creator';
import {
  tva,
  withStyleContext,
  useStyleContext,
  type VariantProps,
} from '@gluestack-ui/utils/nativewind-utils';
import { cssInterop } from 'nativewind';
import { Pressable, TextInput, View } from 'react-native';

const SCOPE = 'INPUT';

const Root = withStyleContext(View, SCOPE);

const UIInput = createInput({
  Root,
  Slot: Pressable,
  Input: TextInput,
  Icon: UIIcon,
});

cssInterop(PrimitiveIcon, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: 'classNameColor',
      stroke: true,
    },
  },
});

const inputStyle = tva({
  base: 'w-full flex-row items-center gap-3 rounded-2xl border border-outline-200 bg-background-0 px-4 data-[hover=true]:border-outline-300 data-[focus=true]:border-tertiary-500 data-[focus=true]:bg-background-50 data-[invalid=true]:border-error-400 data-[invalid=true]:bg-background-error data-[disabled=true]:opacity-50',
  variants: {
    size: {
      sm: 'h-12',
      md: 'h-14',
      lg: 'h-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const inputFieldStyle = tva({
  base: 'flex-1 text-base text-typography-900 placeholder:text-typography-400 web:outline-none',
  parentVariants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
});

const inputSlotStyle = tva({
  base: 'items-center justify-center',
  parentVariants: {
    size: {
      sm: 'min-h-12',
      md: 'min-h-14',
      lg: 'min-h-16',
    },
  },
});

const inputIconStyle = tva({
  base: 'text-typography-500',
  parentVariants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-5 w-5',
    },
  },
});

type IInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof UIInput>,
  'context'
> &
  VariantProps<typeof inputStyle> & { className?: string };

const Input = React.forwardRef<
  React.ElementRef<typeof UIInput>,
  IInputProps
>(({ className, size = 'md', ...props }, ref) => {
  return (
    <UIInput
      ref={ref}
      {...props}
      className={inputStyle({ size, class: className })}
      context={{ size }}
    />
  );
});

type IInputFieldProps = React.ComponentPropsWithoutRef<typeof UIInput.Input> &
  VariantProps<typeof inputFieldStyle> & { className?: string };

const InputField = React.forwardRef<
  React.ElementRef<typeof UIInput.Input>,
  IInputFieldProps
>(({ className, size, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIInput.Input
      ref={ref}
      {...props}
      className={inputFieldStyle({
        parentVariants: {
          size: parentSize,
        },
        size,
        class: className,
      })}
    />
  );
});

type IInputSlotProps = React.ComponentPropsWithoutRef<typeof UIInput.Slot> &
  VariantProps<typeof inputSlotStyle> & { className?: string };

const InputSlot = React.forwardRef<
  React.ElementRef<typeof UIInput.Slot>,
  IInputSlotProps
>(({ className, size, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIInput.Slot
      ref={ref}
      {...props}
      className={inputSlotStyle({
        parentVariants: {
          size: parentSize,
        },
        size,
        class: className,
      })}
    />
  );
});

type IInputIconProps = React.ComponentPropsWithoutRef<typeof UIInput.Icon> &
  VariantProps<typeof inputIconStyle> & {
    className?: string;
    as?: React.ElementType;
    height?: number;
    width?: number;
  };

const InputIcon = React.forwardRef<
  React.ElementRef<typeof UIInput.Icon>,
  IInputIconProps
>(({ className, size, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  if (typeof size === 'number') {
    return (
      <UIInput.Icon
        ref={ref}
        {...props}
        className={inputIconStyle({ class: className })}
        size={size}
      />
    );
  }

  if ((props.height !== undefined || props.width !== undefined) && !size) {
    return (
      <UIInput.Icon
        ref={ref}
        {...props}
        className={inputIconStyle({ class: className })}
      />
    );
  }

  return (
    <UIInput.Icon
      ref={ref}
      {...props}
      className={inputIconStyle({
        parentVariants: {
          size: parentSize,
        },
        size,
        class: className,
      })}
    />
  );
});

Input.displayName = 'Input';
InputField.displayName = 'InputField';
InputSlot.displayName = 'InputSlot';
InputIcon.displayName = 'InputIcon';

export { Input, InputField, InputIcon, InputSlot };


