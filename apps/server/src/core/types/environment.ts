export interface Environment {
    boosterEndpoint: string;
}
  
export const productionEnvironment: Environment = {
    boosterEndpoint: 'https://343jfqlfri.execute-api.eu-west-1.amazonaws.com/production/graphql'
}