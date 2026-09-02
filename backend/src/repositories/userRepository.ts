import { db } from '../database/client';
import { logger } from '../utils/logger';
import { UserRow, CreateUserInput, UpdateUserInput } from '../types/user';

export const createUser = async (input: CreateUserInput & { password_hash: string }): Promise<UserRow> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('users')
    .insert({
      name: input.name,
      email: input.email,
      password_hash: input.password_hash,
      phone: input.phone,
      role: input.role,
    })
    .select()
    .single();

  if (error) {
    logger.error({ error }, 'Failed to create user');
    throw error;
  }

  return data as UserRow;
};

export const findUserById = async (id: string): Promise<UserRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error({ error }, 'Failed to find user by id');
    throw error;
  }

  return data as UserRow;
};

export const findUserByEmail = async (email: string): Promise<UserRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error({ error }, 'Failed to find user by email');
    throw error;
  }

  return data as UserRow;
};

export const findUserByPhone = async (phone: string): Promise<UserRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error({ error }, 'Failed to find user by phone');
    throw error;
  }

  return data as UserRow;
};

export const updateUser = async (id: string, updates: UpdateUserInput | { password_hash: string }): Promise<UserRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error({ error }, 'Failed to update user');
    throw error;
  }

  return data as UserRow;
};

export const deactivateUser = async (id: string): Promise<UserRow | null> => {
  return updateUser(id, { is_active: false });
};

export const listUsers = async (): Promise<UserRow[]> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error }, 'Failed to list users');
    throw error;
  }

  return (data ?? []) as UserRow[];
};
