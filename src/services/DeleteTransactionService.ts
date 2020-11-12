import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<any> {
    const transactions = getCustomRepository(TransactionsRepository);
    

    const findTransaction = await transactions.findOne(id);

    if (!findTransaction) {
      throw new AppError('Transaction not found');
    };


    console.log(findTransaction)
    const respost = await transactions.delete(findTransaction)

    console.log(respost)
    return respost; 
  }
  
}

export default DeleteTransactionService;
