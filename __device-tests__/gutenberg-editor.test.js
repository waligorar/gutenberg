/**
 * @format
 * */

/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	setupDriver,
	isLocalEnvironment,
	timer,
	clickMiddleOfElement,
	clickBeginningOfElement,
	stopDriver } from './helpers/utils';
import testData from './helpers/test-data';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 240000;

describe( 'Gutenberg Editor tests', () => {
	let driver;
	let editorPage;
	let allPassed = true;

	// Use reporter for setting status for saucelabs Job
	if ( ! isLocalEnvironment() ) {
		const reporter = {
			specDone: async ( result ) => {
				allPassed = allPassed && result.status !== 'failed';
			},
		};

		jasmine.getEnv().addReporter( reporter );
	}

	beforeAll( async () => {
		driver = await setupDriver();
		editorPage = new EditorPage( driver );
	} );

	it( 'should be able to see visual editor', async () => {
		await expect( editorPage.getBlockList() ).resolves.toBe( true );
	} );

	it( 'should be able to add a new Paragraph block', async () => {
		await editorPage.addNewParagraphBlock();
		const paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 0 );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.shortText );
		await editorPage.removeBlockAtPosition( 0 );
	} );

	it( 'should be able to split one paragraph block into two', async () => {
		await editorPage.addNewParagraphBlock();
		const paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 0 );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.shortText );
		const textViewElement = await editorPage.getTextViewForParagraphBlock( paragraphBlockElement );
		await clickMiddleOfElement( driver, textViewElement );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, '\n' );
		expect( await editorPage.hasParagraphBlockAtPosition( 0 ) && await editorPage.hasParagraphBlockAtPosition( 1 ) )
			.toBe( true );

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 0 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text0 ).not.toBe( '' );
		expect( text1 ).not.toBe( '' );
		expect( testData.shortText ).toMatch( new RegExp( `${ text0 + text1 }|${ text0 } ${ text1 }` ) );

		await editorPage.removeBlockAtPosition( 1 );
		await editorPage.removeBlockAtPosition( 0 );
	} );

	it( 'should be able to merge 2 paragraph blocks into 1', async () => {
		await editorPage.addNewParagraphBlock();
		let paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 0 );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.shortText );
		let textViewElement = await editorPage.getTextViewForParagraphBlock( paragraphBlockElement );
		await clickMiddleOfElement( driver, textViewElement );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, '\n' );
		expect( await editorPage.hasParagraphBlockAtPosition( 0 ) && await editorPage.hasParagraphBlockAtPosition( 1 ) )
			.toBe( true );

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 0 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 1 );
		textViewElement = await editorPage.getTextViewForParagraphBlock( paragraphBlockElement );
		await clickBeginningOfElement( driver, textViewElement );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, '\u0008' );

		const text = await editorPage.getTextForParagraphBlockAtPosition( 0 );
		expect( text0 + text1 ).toMatch( text );

		expect( await editorPage.hasParagraphBlockAtPosition( 1 ) ).toBe( false );
		await editorPage.removeBlockAtPosition( 0 );
	} );

	it( 'should be able to create a post with multiple paragraph blocks', async () => {
		await editorPage.addNewParagraphBlock();
		const paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 0 );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.longText );

		for ( let i = 3; i > -1; i-- ) {
			await editorPage.removeBlockAtPosition( i );
		}
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
