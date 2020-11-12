import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository'

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;

}

class CreateTransactionService {
  public async execute( { title, value, type, category }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
      
    const { income, outcome, total } = await transactionsRepository.getBalance()

    if ( type === 'outcome' && value > total ){
      throw new AppError('There is not balance for this operation');
    }
    let  checkCategoryExist = await categoriesRepository.findOne({
        where: { title: category },
    })
    
    if (!checkCategoryExist){
      checkCategoryExist = categoriesRepository.create({
          title: category,
       });
    };
    
    await categoriesRepository.save(checkCategoryExist);

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: checkCategoryExist.id
    })

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
