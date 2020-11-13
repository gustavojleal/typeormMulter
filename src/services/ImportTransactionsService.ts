import { getCustomRepository, getRepository, In, TransactionRepository }from 'typeorm'
import csvParse from 'csv-parse';
import fs from 'fs';

import TransactionsRepository from '../repositories/TransactionsRepository'; 
import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRespository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);


    const transactionsReadStream = fs.createReadStream(filePath);

    const categories: string[] = [];
    const transactions: Request[] = [];
    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = transactionsReadStream.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      
      if (!title || !type || !value || !category) return;
      
      categories.push(category);
      transactions.push({ title, type, value, category });
      
    });
  
    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      }
    })

    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategorytitles = categories
    .filter(category => !existentCategoriesTitle.includes(category))
    .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategorytitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);
    
    const finalCategories = [... newCategories, ...existentCategories];

    function findId(id: string) {
      finalCategories.find(
        category => {
          if (category.title === id) return category.id
        },
      ) 
      
    }

    const createdtransactions = transactionRespository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
           category => {
             if (category.title === transaction.category) {
              return 
             }
           },
        )
      })),
    );

    console.log(createdtransactions)
    await transactionRespository.save(createdtransactions);

    await fs.promises.unlink(filePath);

    return createdtransactions;
  }
}

export default ImportTransactionsService;
