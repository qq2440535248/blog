const { Tag } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const items = await Tag.findAll({
      where: { userId: req.auth.userId },
      order: [['id', 'DESC']],
    });
    return res.json({ data: items });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const tag = await Tag.create({
      userId: req.auth.userId,
      name,
    });

    return res.status(201).json({ data: tag });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const tag = await Tag.findOne({
      where: { id: req.params.id, userId: req.auth.userId },
    });

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    tag.name = req.body.name || tag.name;
    await tag.save();

    return res.json({ data: tag });
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const count = await Tag.destroy({
      where: { id: req.params.id, userId: req.auth.userId },
    });

    if (!count) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    return res.json({ message: 'Tag deleted' });
  } catch (err) {
    return next(err);
  }
};
