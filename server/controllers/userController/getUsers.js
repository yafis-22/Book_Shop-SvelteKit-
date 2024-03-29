import { User, Book } from '../../models/index.js';
import { Op } from 'sequelize';

const sortUsers = (users, sortField, sortOrder) => {
  if (sortField && sortOrder) {
    users.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  }
  return users;
};

export const getAllUsers = async (req, res) => {
    try {
      const { search, page = 1, pageSize = 10, sortField, sortOrder } = req.query;
      
      if (page <= 0) {
        return res.status(400).json({ message: 'Please enter a valid page number greater than 0.' });
      }
      // Build the where condition for search
    const whereCondition = search ? {
      [Op.or]: [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ],
    } : {};

    let allUsers = await User.findAll({
      where: whereCondition,
      paranoid: false, 
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [[sortField || 'id', sortOrder || 'asc']],
    });

      const totalUsers = await User.count({
        where: whereCondition,
        paranoid: false
      });

      res.json({
        message: 'Users retrieved successfully',
        totalUsers,
        usersFetched: allUsers.length,
        data: allUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / pageSize),
      });
    } catch (err) {
      console.error('Error reading user data:', err);
      res.status(500).send('Internal Server Error');
    }
  };
  
export const getUserById = async (req, res) => {

    const userId = req.params.id;
  
    try {
      const user = await User.findByPk(userId, {
      paranoid: false,
      include: [
        {
          model: Book,
          as: 'lentBooks',
          attributes: ['id', 'title', 'author', 'category'],
          through: {
            attributes: ['initialCharge', 'timestamp'],
          },
        },
      ],
    });
  
      if (user) {
        res.json(user);
      } else {
        res.status(404).send('User not found');
      }
    } catch (err) {
      console.error('Error reading user data:', err);
      res.status(500).send('Internal Server Error');
    }
  };