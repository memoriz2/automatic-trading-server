import { hashPassword } from '../../utils/auth.js';
export class UserRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * 사용자 생성
     */
    async createUser(userData) {
        const hashedPassword = await hashPassword(userData.password);
        const query = `
      INSERT INTO users (username, password_hash, role, email, first_name, last_name, profile_image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, role, is_active, last_login_at, created_at, updated_at, 
                password_hash, email, first_name, last_name, profile_image_url
    `;
        const values = [
            userData.username,
            hashedPassword,
            userData.role || 'user',
            userData.email || null,
            userData.firstName || null,
            userData.lastName || null,
            userData.profileImageUrl || null
        ];
        const result = await this.pool.query(query, values);
        const row = result.rows[0];
        return {
            id: row.id,
            username: row.username,
            role: row.role,
            isActive: row.is_active,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            passwordHash: row.password_hash,
            password: '', // 보안상 빈 문자열
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            profileImageUrl: row.profile_image_url
        };
    }
    /**
     * 사용자명으로 사용자 조회
     */
    async getUserByUsername(username) {
        const query = `
      SELECT id, username, password_hash as password, role, is_active, last_login_at, 
             created_at, updated_at, email, first_name, last_name, profile_image_url
      FROM users 
      WHERE username = $1
    `;
        const result = await this.pool.query(query, [username]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            username: row.username,
            role: row.role,
            isActive: row.is_active,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            passwordHash: row.password,
            password: row.password,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            profileImageUrl: row.profile_image_url
        };
    }
    /**
     * ID로 사용자 조회
     */
    async getUserById(id) {
        const query = `
      SELECT id, username, password_hash as password, role, is_active, last_login_at,
             created_at, updated_at, email, first_name, last_name, profile_image_url
      FROM users 
      WHERE id = $1
    `;
        const result = await this.pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            username: row.username,
            role: row.role,
            isActive: row.is_active,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            passwordHash: row.password,
            password: row.password,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            profileImageUrl: row.profile_image_url
        };
    }
    /**
     * 모든 사용자 조회 (관리자용)
     */
    async getAllUsers() {
        const query = `
      SELECT id, username, role, is_active, last_login_at, created_at, updated_at,
             email, first_name, last_name, profile_image_url
      FROM users 
      ORDER BY created_at DESC
    `;
        const result = await this.pool.query(query);
        return result.rows.map(row => ({
            id: row.id,
            username: row.username,
            role: row.role,
            isActive: row.is_active,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            passwordHash: '',
            password: '',
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            profileImageUrl: row.profile_image_url
        }));
    }
    /**
     * 사용자 업데이트
     */
    async updateUser(id, updates) {
        const updateFields = [];
        const values = [];
        let paramIndex = 1;
        if (updates.username) {
            updateFields.push(`username = $${paramIndex++}`);
            values.push(updates.username);
        }
        if (updates.password) {
            const hashedPassword = await hashPassword(updates.password);
            updateFields.push(`password_hash = $${paramIndex++}`);
            values.push(hashedPassword);
        }
        if (updates.role) {
            updateFields.push(`role = $${paramIndex++}`);
            values.push(updates.role);
        }
        if (updates.email !== undefined) {
            updateFields.push(`email = $${paramIndex++}`);
            values.push(updates.email);
        }
        updateFields.push(`updated_at = NOW()`);
        values.push(id); // WHERE 절용
        const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, role, is_active, last_login_at, created_at, updated_at,
                password_hash, email, first_name, last_name, profile_image_url
    `;
        const result = await this.pool.query(query, values);
        const row = result.rows[0];
        return {
            id: row.id,
            username: row.username,
            role: row.role,
            isActive: row.is_active,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            passwordHash: row.password_hash,
            password: '',
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            profileImageUrl: row.profile_image_url
        };
    }
}
