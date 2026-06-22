"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Service } from "@barberia-jeranbuq/database";
import {
  createServiceSchema,
  updateServiceSchema,
  type ServiceFormData,
  type UpdateServiceData,
  SERVICE_CATEGORIES,
  CATEGORY_LABELS,
} from "@barberia-jeranbuq/shared";
import {
  createServiceAction,
  updateServiceAction,
} from "@/backend/actions/services.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Button } from "@/frontend/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";

// ─── Shared field layout ──────────────────────────────────────────────────────

/**
 * Renders the COP price input with a currency label prefix.
 * Used in both create and edit inner forms.
 */
function PriceInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground shrink-0">COP</span>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ─── CreateServiceForm ────────────────────────────────────────────────────────

function CreateServiceForm({
  onSuccess,
  onClose,
}: {
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      durationMin: 30,
      price: 0,
      category: "HAIRCUT",
      priceNote: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: ServiceFormData) {
    setServerError(null);
    const result = await createServiceAction(data);
    if (!result.ok) {
      setServerError(
        result.error === "VALIDATION_ERROR"
          ? "Invalid data. Please review the fields."
          : (result.error ?? "An unexpected error occurred.")
      );
      return;
    }
    onSuccess?.();
    onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Classic Haircut" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="durationMin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={10}
                  max={240}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <PriceInput
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priceNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota de precio</FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g. "desde $32.000"'
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Service"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── EditServiceForm ──────────────────────────────────────────────────────────

function EditServiceForm({
  service,
  onSuccess,
  onClose,
}: {
  service: Service;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<UpdateServiceData>({
    resolver: zodResolver(updateServiceSchema),
    defaultValues: {
      id: service.id,
      name: service.name,
      description: service.description ?? "",
      durationMin: service.durationMin,
      price: service.price,
      category: service.category,
      priceNote: service.priceNote ?? "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: UpdateServiceData) {
    setServerError(null);
    const result = await updateServiceAction(data);
    if (!result.ok) {
      setServerError(
        result.error === "VALIDATION_ERROR"
          ? "Invalid data. Please review the fields."
          : (result.error ?? "An unexpected error occurred.")
      );
      return;
    }
    onSuccess?.();
    onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Classic Haircut" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="durationMin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={10}
                  max={240}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <PriceInput
                  value={field.value ?? 0}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priceNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota de precio</FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g. "desde $32.000"'
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── ServiceForm ──────────────────────────────────────────────────────────────

type ServiceFormProps =
  | {
      mode: "create";
      defaultValues?: undefined;
      trigger: React.ReactNode;
      onSuccess?: () => void;
    }
  | {
      mode: "edit";
      defaultValues: Service;
      trigger: React.ReactNode;
      onSuccess?: () => void;
    };

/**
 * Dialog wrapper for create/edit service form.
 * Controls open/close state internally; caller passes a trigger element.
 */
export function ServiceForm({
  mode,
  defaultValues,
  trigger,
  onSuccess,
}: ServiceFormProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Service" : "Edit Service"}
          </DialogTitle>
        </DialogHeader>

        {mode === "create" ? (
          <CreateServiceForm
            onSuccess={onSuccess}
            onClose={() => setOpen(false)}
          />
        ) : (
          <EditServiceForm
            service={defaultValues}
            onSuccess={onSuccess}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
