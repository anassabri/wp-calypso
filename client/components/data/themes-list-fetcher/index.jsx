/**
 * External dependencies
 */
import React from 'react';
import omit from 'lodash/object/omit';
import once from 'lodash/function/once';
import filter from 'lodash/collection/filter';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { PER_PAGE } from 'state/themes/themes-list/constants';
import { query, fetchNextPage } from 'state/themes/actions';
import { hasSiteChanged, isJetpack } from 'state/themes/themes-last-query/selectors';
import { isLastPage, isFetchingNextPage, getThemesList } from 'state/themes/themes-list/selectors';
import { getThemeById } from 'state/themes/themes/selectors';

const ThemesListFetcher = React.createClass( {
	propTypes: {
		children: React.PropTypes.element.isRequired,
		site: React.PropTypes.oneOfType( [
			React.PropTypes.object,
			React.PropTypes.bool
		] ).isRequired,
		isMultisite: React.PropTypes.bool,
		search: React.PropTypes.string,
		tier: React.PropTypes.string,
		onRealScroll: React.PropTypes.func,
		onLastPage: React.PropTypes.func,
		// Connected props
		themes: React.PropTypes.array.isRequired,
		lastPage: React.PropTypes.bool.isRequired,
		loading: React.PropTypes.bool.isRequired,
		lastQuery: React.PropTypes.shape( {
			hasSiteChanged: React.PropTypes.bool.isRequired,
			isJetpack: React.PropTypes.bool.isRequired
		} ).isRequired,
		query: React.PropTypes.func.isRequired,
		fetchNextPage: React.PropTypes.func.isRequired,
	},

	componentDidMount: function() {
		this.refresh( this.props );
	},

	componentWillReceiveProps: function( nextProps ) {
		if (
				nextProps.tier !== this.props.tier || (
					nextProps.search !== this.props.search && (
						! nextProps.lastQuery.isJetpack ||
						nextProps.lastQuery.hasSiteChanged
						)
					)
			) {
			this.refresh( nextProps );
		}
	},

	refresh: function( props ) {
		if ( this.props.site || this.props.isMultisite ) {
			this.queryThemes( props );
		}
	},

	queryThemes: function( props ) {
		const {
			onLastPage,
			site,
			search,
			tier,
		} = props;

		this.onLastPage = onLastPage ? once( onLastPage ) : null;

		this.props.query( {
			search,
			tier,
			page: 0,
			perPage: PER_PAGE,
		} );

		this.props.fetchNextPage( site );
	},

	fetchNextPage: function( options ) {
		if ( this.props.loading || this.props.lastPage ) {
			return;
		}

		const {
			site = false,
			onRealScroll = () => null,
		} = this.props;

		if ( options.triggeredByScroll ) {
			onRealScroll();
		}

		this.props.fetchNextPage( site );
	},

	render: function() {
		const props = omit( this.props, 'children' );
		return React.cloneElement( this.props.children, Object.assign( {}, props, {
			fetchNextPage: this.fetchNextPage
		} ) );
	}

} );

function getFilteredThemes( state, search ) {
	const allThemes = getThemesList( state )
		.map( getThemeById.bind( null, state ) );

	if ( ! isJetpack( state ) || ! search ) {
		return allThemes;
	}

	return filter( allThemes, theme => matches( theme, search ) );
}

function matches( theme, rawSearch ) {
	const search = rawSearch.toLowerCase().trim();

	return [ 'name', 'tags', 'description', 'author' ].some( field => (
		theme[ field ] && join( theme[ field ] )
			.toLowerCase().replace( '-', ' ' )
			.indexOf( search ) >= 0
	) );
}

function join( value ) {
	return Array.isArray( value ) ? value.join( ' ' ) : value;
}

export default connect(
	( state, props ) => Object.assign( {},
		props,
		{
			themes: getFilteredThemes( state, props.search ),
			lastPage: isLastPage( state ),
			loading: isFetchingNextPage( state ),
			lastQuery: {
				hasSiteChanged: hasSiteChanged( state ),
				isJetpack: isJetpack( state )
			}
		}
	),
	bindActionCreators.bind( null, { query, fetchNextPage } )
)( ThemesListFetcher );
