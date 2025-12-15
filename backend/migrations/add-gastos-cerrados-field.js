export async function up(queryInterface, Sequelize) {
	await queryInterface.addColumn('reservas', 'gastos_cerrados', {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
		allowNull: false,
		comment: 'Indica si el registro de gastos está cerrado para esta reserva'
	});
}

export async function down(queryInterface, Sequelize) {
	await queryInterface.removeColumn('reservas', 'gastos_cerrados');
}
