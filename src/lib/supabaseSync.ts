import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

export interface PrismaField {
  name: string;
  type: string;
  kind: string;
  isOptional: boolean;
  isList: boolean;
  default?: any;
  relation?: string;
}

export interface PrismaModel {
  name: string;
  fields: PrismaField[];
  uniqueFields: string[][];
  indexes: any[];
}

export interface SupabaseTable {
  name: string;
  sql: string;
  rls: string[];
}

export interface SchemaMapping {
  prismaModels: PrismaModel[];
  supabaseTables: SupabaseTable[];
}

class SupabaseSyncHelper {
  private supabase: any;
  private schemaPath: string;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    this.schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
  }

  /**
   * Parse Prisma schema to extract models and fields
   */
  parsePrismaSchema(): PrismaModel[] {
    if (!existsSync(this.schemaPath)) {
      throw new Error('Prisma schema file not found');
    }

    const schemaContent = readFileSync(this.schemaPath, 'utf8');
    const models: PrismaModel[] = [];

    // Simple regex-based parser for demonstration
    // In production, use a proper AST parser
    const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
    let match;

    while ((match = modelRegex.exec(schemaContent)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];
      
      const fields = this.parseModelFields(modelBody);
      
      models.push({
        name: modelName.toLowerCase(),
        fields,
        uniqueFields: [],
        indexes: []
      });
    }

    return models;
  }

  /**
   * Parse fields within a model
   */
  private parseModelFields(modelBody: string): PrismaField[] {
    const fields: PrismaField[] = [];
    const fieldRegex = /(\w+)\s+([^@\n]+)(@[^\n]*)?/g;
    let match;

    while ((match = fieldRegex.exec(modelBody)) !== null) {
      const fieldName = match[1];
      const fieldType = match[2].trim();
      const attributes = match[3] || '';

      const field: PrismaField = {
        name: fieldName,
        type: fieldType,
        kind: 'scalar',
        isOptional: fieldType.includes('?'),
        isList: fieldType.includes('[]'),
        default: this.extractDefault(fieldType)
      };

      // Check if it's a relation
      if (attributes.includes('@relation')) {
        field.kind = 'object';
        field.relation = this.extractRelationName(attributes);
      }

      fields.push(field);
    }

    return fields;
  }

  /**
   * Extract default value from field type
   */
  private extractDefault(fieldType: string): any {
    const defaultMatch = fieldType.match(/default\(([^)]+)\)/);
    return defaultMatch ? defaultMatch[1] : undefined;
  }

  /**
   * Extract relation name from attributes
   */
  private extractRelationName(attributes: string): string {
    const relationMatch = attributes.match(/@relation\(["']([^"']+)["']\)/);
    return relationMatch ? relationMatch[1] : '';
  }

  /**
   * Convert Prisma type to PostgreSQL type
   */
  prismaToPostgresType(prismaType: string): string {
    const typeMap: { [key: string]: string } = {
      'String': 'TEXT',
      'Int': 'INTEGER',
      'Float': 'DECIMAL',
      'Boolean': 'BOOLEAN',
      'DateTime': 'TIMESTAMPTZ',
      'Json': 'JSONB',
      'Bytes': 'BYTEA',
      'BigInt': 'BIGINT'
    };

    // Remove optional and list markers
    const baseType = prismaType.replace(/[?\[\]]/g, '');
    
    return typeMap[baseType] || 'TEXT';
  }

  /**
   * Generate SQL for creating a table from Prisma model
   */
  generateTableSQL(model: PrismaModel): string {
    const tableName = model.name;
    const columns: string[] = [];

    // Add ID column
    columns.push(`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`);

    // Add other columns
    for (const field of model.fields) {
      if (field.name === 'id') continue;

      let columnDef = `${field.name} ${this.prismaToPostgresType(field.type)}`;
      
      if (!field.isOptional) {
        columnDef += ' NOT NULL';
      }

      if (field.default) {
        columnDef += ` DEFAULT ${field.default}`;
      }

      columns.push(columnDef);
    }

    // Add timestamps
    if (!model.fields.find(f => f.name === 'created_at')) {
      columns.push('created_at TIMESTAMPTZ DEFAULT NOW()');
    }
    if (!model.fields.find(f => f.name === 'updated_at')) {
      columns.push('updated_at TIMESTAMPTZ DEFAULT NOW()');
    }

    return `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns.join(',\n        ')}
      );
    `;
  }

  /**
   * Generate RLS policies for a table
   */
  generateRLSPolicies(tableName: string): string[] {
    const policies = [
      `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "${tableName}_select_own" ON ${tableName};`,
      `CREATE POLICY "${tableName}_select_own" ON ${tableName} FOR SELECT USING (auth.uid() = id);`,
      `DROP POLICY IF EXISTS "${tableName}_update_own" ON ${tableName};`,
      `CREATE POLICY "${tableName}_update_own" ON ${tableName} FOR UPDATE USING (auth.uid() = id);`,
      `DROP POLICY IF EXISTS "admin_full_access_${tableName}" ON ${tableName};`,
      `CREATE POLICY "admin_full_access_${tableName}" ON ${tableName} FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role IN ('admin', 'ADMIN')
        )
      );`
    ];

    return policies;
  }

  /**
   * Execute SQL on Supabase
   */
  async executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.rpc('exec_sql', { sql });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync Prisma schema to Supabase
   */
  async syncSchema(): Promise<{ success: boolean; steps: any[]; error?: string }> {
    const steps = [
      { name: 'Parsing Prisma Schema', status: 'pending' },
      { name: 'Generating SQL', status: 'pending' },
      { name: 'Creating Tables', status: 'pending' },
      { name: 'Enabling RLS', status: 'pending' },
      { name: 'Validating Schema', status: 'pending' }
    ];

    try {
      // Step 1: Parse Prisma schema
      steps[0].status = 'running';
      const prismaModels = this.parsePrismaSchema();
      steps[0].status = 'completed';

      // Step 2: Generate SQL
      steps[1].status = 'running';
      const tables = prismaModels.map(model => ({
        name: model.name,
        sql: this.generateTableSQL(model),
        rls: this.generateRLSPolicies(model.name)
      }));
      steps[1].status = 'completed';

      // Step 3: Create tables
      steps[2].status = 'running';
      for (const table of tables) {
        const result = await this.executeSQL(table.sql);
        if (!result.success) {
          steps[2].status = 'error';
          return { 
            success: false, 
            steps, 
            error: `Failed to create table ${table.name}: ${result.error}` 
          };
        }
      }
      steps[2].status = 'completed';

      // Step 4: Enable RLS
      steps[3].status = 'running';
      for (const table of tables) {
        for (const rlsPolicy of table.rls) {
          const result = await this.executeSQL(rlsPolicy);
          if (!result.success) {
            console.warn(`RLS Warning for ${table.name}:`, result.error);
          }
        }
      }
      steps[3].status = 'completed';

      // Step 5: Validate schema
      steps[4].status = 'running';
      for (const table of tables) {
        const { error } = await this.supabase.from(table.name).select('*').limit(1);
        if (error && error.code !== 'PGRST116') {
          steps[4].status = 'error';
          return { 
            success: false, 
            steps, 
            error: `Validation failed for ${table.name}: ${error.message}` 
          };
        }
      }
      steps[4].status = 'completed';

      return { 
        success: true, 
        steps,
        summary: {
          tablesCreated: tables.length,
          rlsEnabled: tables.length,
          modelsProcessed: prismaModels.length
        }
      };

    } catch (error: any) {
      return { 
        success: false, 
        steps, 
        error: `Unexpected error: ${error.message}` 
      };
    }
  }

  /**
   * Get current Supabase schema info
   */
  async getSupabaseSchema(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Supabase schema:', error);
      return [];
    }
  }

  /**
   * Compare schemas and return differences
   */
  async compareSchemas(): Promise<{
    missingInSupabase: string[];
    extraInSupabase: string[];
    common: string[];
  }> {
    const prismaModels = this.parsePrismaSchema();
    const supabaseTables = await this.getSupabaseSchema();
    
    const prismaTableNames = prismaModels.map(m => m.name);
    const supabaseTableNames = supabaseTables.map(t => t.table_name);

    const missingInSupabase = prismaTableNames.filter(
      name => !supabaseTableNames.includes(name)
    );
    const extraInSupabase = supabaseTableNames.filter(
      name => !prismaTableNames.includes(name)
    );
    const common = prismaTableNames.filter(
      name => supabaseTableNames.includes(name)
    );

    return {
      missingInSupabase,
      extraInSupabase,
      common
    };
  }
}

export default SupabaseSyncHelper;