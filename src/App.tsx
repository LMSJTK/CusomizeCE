/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { CustomizeCE } from './CustomizeCE';

export default function App() {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('<p>Welcome to the <strong>Customize CE</strong> editor!</p><p>Select some text and click "Add Threat Data" to test the custom extension.</p><p>Select some text to see the AI Assistant Bubble Menu.</p>');

  useEffect(() => {
    if (!editorRef.current || !toolbarRef.current) return;

    const editorInstance = new CustomizeCE({
      element: editorRef.current,
      toolbarElement: toolbarRef.current,
      content: html,
      onChange: (newHtml) => {
        setHtml(newHtml);
      }
    });

    return () => {
      editorInstance.destroy();
    };
  }, []); // Run once on mount

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Customize CE Editor</h1>
          <p className="mt-2 text-sm text-gray-600">
            A standalone Tiptap-based editor with custom Threat Attributes and AI Assistant.
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
          {/* Toolbar Container */}
          <div ref={toolbarRef}></div>
          
          {/* Editor Container (A4 Page Style) */}
          <div className="p-8 bg-gray-100 flex justify-center overflow-y-auto max-h-[600px]">
            <div 
              className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-gray-200 prose prose-indigo max-w-none focus:outline-none"
              ref={editorRef}
            ></div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Output HTML</h2>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-sm whitespace-pre-wrap">
            {html}
          </pre>
        </div>
      </div>
    </div>
  );
}
