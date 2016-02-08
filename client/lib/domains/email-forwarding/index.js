function emailForwardingPlanLimit( product_id ) {
	let planLimit;
	if ( product_id === 1008 ) {
		planLimit = 100;
	} else {
		planLimit = 5;
	}

	return planLimit;
}

module.exports = { emailForwardingPlanLimit };
