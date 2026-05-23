import type { Category, CurrencyCode, Product, ProductStatus } from "../../domain/types";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors";
import type { EventBus } from "../../shared/events";
import { createId, nowIso, slugify } from "../../shared/id";
import { InMemoryRepository } from "../../shared/store";

export interface CreateCategoryInput {
  tenantId: string;
  name: string;
  slug?: string;
  parentId?: string;
}

export interface CreateProductInput {
  tenantId: string;
  sku?: string;
  name: string;
  description?: string;
  categoryId?: string;
  priceMinor: number;
  currency?: CurrencyCode;
  taxRate?: number;
  stockTracked?: boolean;
  stockQuantity?: number;
  status?: ProductStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  priceMinor?: number;
  currency?: CurrencyCode;
  taxRate?: number;
  stockTracked?: boolean;
  stockQuantity?: number;
  status?: ProductStatus;
  metadata?: Record<string, unknown>;
}

export class ProductService {
  private categories = new InMemoryRepository<Category>();
  private products = new InMemoryRepository<Product>();

  constructor(private eventBus: EventBus) {}

  createCategory(input: CreateCategoryInput): Category {
    const slug = input.slug ? slugify(input.slug) : slugify(input.name);
    const duplicate = this.categories
      .listByTenant(input.tenantId)
      .find((category) => category.slug === slug && category.parentId === input.parentId);

    if (duplicate) {
      throw new ConflictError(`Category slug already exists: ${slug}`);
    }

    const now = nowIso();
    const category: Category = {
      id: createId("CAT"),
      tenantId: input.tenantId,
      name: input.name,
      slug,
      parentId: input.parentId,
      createdAt: now,
      updatedAt: now
    };

    const created = this.categories.create(category);
    this.eventBus.publish("category.created", "CommerceOS", created.tenantId, created);
    return created;
  }

  listCategories(tenantId: string): Category[] {
    return this.categories.listByTenant(tenantId);
  }

  getCategory(tenantId: string, categoryId: string): Category {
    const category = this.categories.get(categoryId);
    if (category.tenantId !== tenantId) {
      throw new NotFoundError(`Category not found: ${categoryId}`);
    }
    return category;
  }

  createProduct(input: CreateProductInput): Product {
    if (input.categoryId) {
      this.getCategory(input.tenantId, input.categoryId);
    }

    if (input.priceMinor < 0) {
      throw new BadRequestError("priceMinor cannot be negative");
    }

    const sku = input.sku ?? `SKU-${createId("").replace("-", "")}`;
    const duplicateSku = this.products
      .listByTenant(input.tenantId)
      .find((product) => product.sku.toLowerCase() === sku.toLowerCase());

    if (duplicateSku) {
      throw new ConflictError(`SKU already exists: ${sku}`);
    }

    const now = nowIso();
    const product: Product = {
      id: createId("PROD"),
      tenantId: input.tenantId,
      sku,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      priceMinor: input.priceMinor,
      currency: input.currency ?? "INR",
      taxRate: input.taxRate ?? 0,
      stockTracked: input.stockTracked ?? true,
      stockQuantity: input.stockQuantity ?? 0,
      status: input.status ?? "active",
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now
    };

    const created = this.products.create(product);
    this.eventBus.publish("product.created", "CommerceOS", created.tenantId, created);
    return created;
  }

  listProducts(input: { tenantId: string; status?: ProductStatus; categoryId?: string }): Product[] {
    return this.products
      .listByTenant(input.tenantId)
      .filter((product) => (input.status ? product.status === input.status : product.status !== "archived"))
      .filter((product) => (input.categoryId ? product.categoryId === input.categoryId : true));
  }

  getProduct(tenantId: string, productId: string): Product {
    const product = this.products.get(productId);
    if (product.tenantId !== tenantId || product.status === "archived") {
      throw new NotFoundError(`Product not found: ${productId}`);
    }
    return product;
  }

  getProductForInternalUse(tenantId: string, productId: string): Product {
    const product = this.products.get(productId);
    if (product.tenantId !== tenantId) {
      throw new NotFoundError(`Product not found: ${productId}`);
    }
    return product;
  }

  updateProduct(tenantId: string, productId: string, input: UpdateProductInput): Product {
    this.getProductForInternalUse(tenantId, productId);
    if (input.categoryId) {
      this.getCategory(tenantId, input.categoryId);
    }

    const updated = this.products.update(productId, (current) => ({
      ...current,
      ...input,
      metadata: input.metadata ?? current.metadata,
      updatedAt: nowIso()
    }));

    this.eventBus.publish("product.updated", "CommerceOS", tenantId, updated);
    return updated;
  }

  archiveProduct(tenantId: string, productId: string): Product {
    const updated = this.updateProduct(tenantId, productId, { status: "archived" });
    this.eventBus.publish("product.archived", "CommerceOS", tenantId, updated);
    return updated;
  }
}
