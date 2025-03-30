const ExcelJS = require('exceljs');
const pool = require('../db/db');

const crearTransaccion = async (req, res) => {
    try {
        const { tipo, monto, descripcion, entidad_relacionada } = req.body;
        
        // Validaciones básicas
        if (!tipo || !monto || !descripcion) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        const query = `
            INSERT INTO transacciones 
            (usuario_id, tipo, monto, descripcion, entidad_relacionada)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const values = [
            req.usuario.id,
            tipo,
            monto,
            descripcion,
            entidad_relacionada || null
        ];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear transacción' });
    }
};

const obtenerTransacciones = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM transacciones WHERE usuario_id = $1 ORDER BY fecha DESC',
            [req.usuario.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener transacciones' });
    }
};

const exportarExcel = async (req, res) => {
    try {
        // 1. Obtener transacciones del usuario
        const result = await pool.query(
            `SELECT fecha, tipo, monto, descripcion, entidad_relacionada 
            FROM transacciones 
            WHERE usuario_id = $1 
            ORDER BY fecha DESC`,
            [req.usuario.id]
        );

        // 2. Crear libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transacciones');

        // 3. Configurar columnas
        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 10 },
            { header: 'Monto (USD)', key: 'monto', width: 15, style: { numFmt: '"$"#,##0.00' } },
            { header: 'Descripción', key: 'descripcion', width: 40 },
            { header: 'Entidad Relacionada', key: 'entidad_relacionada', width: 25 }
        ];

        // 4. Agregar datos
        result.rows.forEach(transaccion => {
            worksheet.addRow({
                fecha: transaccion.fecha,
                tipo: transaccion.tipo,
                monto: transaccion.monto,
                descripcion: transaccion.descripcion,
                entidad_relacionada: transaccion.entidad_relacionada
            });
        });

        // 5. Configurar respuesta
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=transacciones.xlsx'
        );

        // 6. Enviar archivo
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generando Excel:', error);
        res.status(500).json({ error: 'Error generando reporte' });
    }
};

module.exports = {
    crearTransaccion,
    obtenerTransacciones,
    exportarExcel
};