import type { Operator } from '@/types/operator'

const MOCK_OPERATORS: Operator[] = [
  {
    email: 'operador@krica.com',
    nome: 'Ana Operadora',
    clienteCod: 'KRICA',
    loja: 'KricaKids',
    perfil: 'operador',
    ativo: true,
  },
  {
    email: 'admin@marketplace.com',
    nome: 'Bruno Admin',
    clienteCod: 'DANIK',
    loja: 'Presente Net',
    perfil: 'admin',
    ativo: true,
  },
  {
    email: 'interno@marketplace.com',
    nome: 'Carla Interna',
    clienteCod: 'SAMUE',
    loja: 'Presente Net',
    perfil: 'interno',
    ativo: true,
  },
]

export async function listOperators() {
  return MOCK_OPERATORS
}

export async function getOperatorByEmail(email: string) {
  return MOCK_OPERATORS.find((operator) => operator.email.toLowerCase() === email.toLowerCase()) ?? null
}

export async function validateActiveOperator(email: string) {
  const operator = await getOperatorByEmail(email)

  if (!operator || !operator.ativo) {
    throw new Error('Operador invalido ou inativo')
  }

  return operator
}
