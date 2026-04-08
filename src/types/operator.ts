export type OperatorProfile = 'operador' | 'admin' | 'interno'

export type Operator = {
  email: string
  nome: string
  clienteCod: string
  loja: string
  perfil: OperatorProfile
  ativo: boolean
}
