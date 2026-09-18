import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db';
import { requireAuth, requireAdmin } from '../middleware/auth';

export const categoryRouter = Router();

// GET /api/categories - List all categories with live book counts
categoryRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await queryAll<any>(
      `SELECT c.id, c.name, c.description, c.icon_name, c.created_at,
              COUNT(b.id) as book_count
       FROM categories c
       LEFT JOIN books b ON b.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      iconName: cat.icon_name || 'BookOpen',
      bookCount: cat.book_count || 0,
      createdAt: cat.created_at
    }));

    res.json({ categories: formatted });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// POST /api/categories - Admin only: create category
categoryRouter.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, iconName } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const cleanName = name.trim();
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existing = await queryOne('SELECT id FROM categories WHERE id = ? OR name = ?', [
      id,
      cleanName
    ]);
    if (existing) {
      res.status(409).json({ error: 'A category with this name already exists' });
      return;
    }

    await run(
      'INSERT INTO categories (id, name, description, icon_name) VALUES (?, ?, ?, ?)',
      [id, cleanName, description ? description.trim() : null, iconName || 'BookOpen']
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        id,
        name: cleanName,
        description,
        iconName: iconName || 'BookOpen',
        bookCount: 0
      }
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Admin only: update category
categoryRouter.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, iconName } = req.body;

    const existing = await queryOne('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description.trim());
    }
    if (iconName !== undefined) {
      fields.push('icon_name = ?');
      params.push(iconName.trim());
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields provided to update' });
      return;
    }

    params.push(id);
    await run(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);

    const updated = await queryOne<any>('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({
      message: 'Category updated successfully',
      category: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        iconName: updated.icon_name || 'BookOpen'
      }
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({ error: error.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Admin only: delete category
categoryRouter.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if books are assigned to this category
    const bookCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM books WHERE category_id = ?',
      [id]
    );

    if (bookCount && bookCount.count > 0) {
      res.status(400).json({
        error: `Cannot delete category. There are ${bookCount.count} books currently assigned to it.`
      });
      return;
    }

    const result = await run('DELETE FROM categories WHERE id = ?', [id]);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
});
