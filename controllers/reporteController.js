const ExcelJS = require('exceljs');
const pool = require('../db/db');

const generarReporteExcel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transacciones');
        
        // Cabeceras
        worksheet.columns = [
            { header: 'Fecha', key: 'fecha' },
            { header: 'Tipo', key: 'tipo' },
            { header: 'Monto', key: 'monto' },
            { header: 'Descripción', key: 'descripcion' }
        ];

    // Datos
    const result = await pool.query(
        'SELECT * FROM transacciones WHERE usuario_id = $1',
        [req.usuario.id]
    );
    
    result.rows.forEach(transaccion => {
        worksheet.addRow({
            fecha: transaccion.fecha,
            tipo: transaccion.tipo,
            monto: transaccion.monto,
            descripcion: transaccion.descripcion
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
    
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generando reporte' });
    }
};

module.exports = { generarReporteExcel };