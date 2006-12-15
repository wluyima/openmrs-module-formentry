package org.openmrs.module.formEntry.web;

import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.api.context.Context;
import org.openmrs.module.formEntry.FormEntryArchive;
import org.openmrs.module.formEntry.FormEntryError;
import org.openmrs.module.formEntry.FormEntryQueue;
import org.openmrs.module.formEntry.FormEntryService;
import org.openmrs.web.WebConstants;

/**
 * Provides form download services, including download of the form template to
 * trigger the form application (e.g., Microsoft&reg; InfoPath&trade;) on the
 * client, download of an empty template, and download of a form schema.
 *  
 * @author Ben Wolfe
 * @author Burke Mamlin
 * @version 1.0
 */
public class FormEntryQueueDownloadServlet extends HttpServlet {

	public static final long serialVersionUID = 123423L;

	private Log log = LogFactory.getLog(this.getClass());

	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		
		Integer startId = null;
		Integer endId = null;
		String queueType = "";
		HttpSession httpSession = request.getSession();

		if (Context.isAuthenticated() == false) {
			httpSession.setAttribute(WebConstants.OPENMRS_ERROR_ATTR,
					"auth.session.expired");
			response.sendRedirect(request.getContextPath() + "/logout");
			return;
		}

		try {
			startId = Integer.parseInt(request.getParameter("startId"));
			endId = Integer.parseInt(request.getParameter("endId"));
		} catch (NumberFormatException e) {
			log.warn("Invalid start or end id parameter", e);
			return;
		}
		
		queueType = request.getParameter("queueType");
		
		response.setHeader("Content-Type", "application/zip");
		response.setHeader("Content-Disposition", "attachment; filename=formEntryQueue-" + queueType + "-(" + startId + "-" + endId + ").zip");
	
		//ByteArrayOutputStream baos  = new ByteArrayOutputStream();
		//GZIPOutputStream gzos        = new GZIPOutputStream(baos);
		ZipOutputStream zos			= new ZipOutputStream(response.getOutputStream());
		FormEntryService fs			= (FormEntryService)Context.getService(FormEntryService.class);
		ZipEntry zipEntry			= null;

		while (startId <= endId) {
	        
			// formData of queue
			String formData = "";
			
			if (queueType.equals("pending")) {
				FormEntryQueue queue = fs.getFormEntryQueue(startId);
				if (queue != null)
					formData = queue.getFormData();
			}
			else if (queueType.equals("archive")) {
				FormEntryArchive queue = fs.getFormEntryArchive(startId);
				if (queue != null)
					formData = queue.getFormData();
			}
			else if (queueType.equals("error")) {
				FormEntryError queue = fs.getFormEntryError(startId);
				if (queue != null)
					formData = queue.getFormData();
			}
	        
			byte [] uncompressedBytes = formData.getBytes();
	        
			// name this entry
	        zipEntry = new ZipEntry("formEntryQueue-" + queueType + "-" + startId + ".xml");

	        // Add ZIP entry to output stream.
            zos.putNextEntry(zipEntry);
    
            // Transfer bytes from the formData to the ZIP file
            zos.write(uncompressedBytes, 0, uncompressedBytes.length);
	
            zos.closeEntry();
            
			startId += 1;
			
			fs.garbageCollect();
	}
		
		zos.close();

	}

}
