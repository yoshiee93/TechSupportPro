import { Pool } from '@neondatabase/serverless';

async function clearTestData() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🗑️ Clearing all test data...');
    
    // Clear in order to respect foreign key constraints
    await pool.query('DELETE FROM time_logs');
    console.log('✓ Cleared time logs');
    
    await pool.query('DELETE FROM repair_notes');
    console.log('✓ Cleared repair notes');
    
    await pool.query('DELETE FROM activity_logs');
    console.log('✓ Cleared activity logs');
    
    await pool.query('DELETE FROM attachments');
    console.log('✓ Cleared attachments');
    
    await pool.query('DELETE FROM billable_items');
    console.log('✓ Cleared billable items');
    
    await pool.query('DELETE FROM sale_items');
    console.log('✓ Cleared sale items');
    
    await pool.query('DELETE FROM sales_transactions');
    console.log('✓ Cleared sales transactions');
    
    await pool.query('DELETE FROM purchase_order_items');
    console.log('✓ Cleared purchase order items');
    
    await pool.query('DELETE FROM purchase_orders');
    console.log('✓ Cleared purchase orders');
    
    await pool.query('DELETE FROM stock_movements');
    console.log('✓ Cleared stock movements');
    
    await pool.query('DELETE FROM low_stock_alerts');
    console.log('✓ Cleared low stock alerts');
    
    await pool.query('DELETE FROM parts_orders');
    console.log('✓ Cleared parts orders');
    
    await pool.query('DELETE FROM tickets');
    console.log('✓ Cleared tickets');
    
    await pool.query('DELETE FROM devices');
    console.log('✓ Cleared devices');
    
    await pool.query('DELETE FROM clients');
    console.log('✓ Cleared clients');
    
    await pool.query('DELETE FROM parts');
    console.log('✓ Cleared parts');
    
    await pool.query('DELETE FROM categories');
    console.log('✓ Cleared categories');
    
    await pool.query('DELETE FROM suppliers');
    console.log('✓ Cleared suppliers');
    
    await pool.query('DELETE FROM reminders');
    console.log('✓ Cleared reminders');
    
    // Reset auto-increment sequences
    await pool.query('ALTER SEQUENCE clients_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE devices_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE tickets_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE parts_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE suppliers_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE sales_transactions_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE billable_items_id_seq RESTART WITH 1');
    console.log('✓ Reset ID sequences');
    
    console.log('\n🎉 All test data cleared successfully!');
    console.log('📝 Ready for fresh testing data');
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  clearTestData();
}

export { clearTestData };