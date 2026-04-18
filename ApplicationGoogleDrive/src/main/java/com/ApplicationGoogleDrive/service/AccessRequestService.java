package com.ApplicationGoogleDrive.service;

import com.ApplicationGoogleDrive.model.AccessRequest;
import com.ApplicationGoogleDrive.model.File;
import com.ApplicationGoogleDrive.model.User;
import com.ApplicationGoogleDrive.repository.AccessRequestRepository;
import com.ApplicationGoogleDrive.repository.FileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class AccessRequestService {

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    @Autowired
    private FileRepository fileRepository;

    @Transactional
    public AccessRequest createRequest(User requester, Long fileId, String message) {
        log.info("Creating access request. Requester: {}, File ID: {}, Message: {}",
                requester.getEmail(), fileId, message);

        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> {
                    log.error("File not found with ID: {}", fileId);
                    return new RuntimeException("File not found with id: " + fileId);
                });

        log.info("File found: {} (Owner: {})",
                file.getFileName(), file.getOwner().getEmail());

        // Vérifier si l'utilisateur n'est pas le propriétaire
        if (file.getOwner().getId().equals(requester.getId())) {
            log.warn("User {} tried to request access to their own file", requester.getEmail());
            throw new RuntimeException("You cannot request access to your own file");
        }

        // Vérifier si le fichier est public
        if (file.isPublic()) {
            log.warn("User {} tried to request access to public file", requester.getEmail());
            throw new RuntimeException("This file is already public, no need to request access");
        }

        // Vérifier si une demande existe déjà
        Optional<AccessRequest> existingRequestOpt = accessRequestRepository
                .findByFileIdAndRequesterId(fileId, requester.getId());

        if (existingRequestOpt.isPresent()) {
            AccessRequest existingRequest = existingRequestOpt.get();

            if (existingRequest.getStatus() == AccessRequest.RequestStatus.PENDING) {
                log.warn("User {} already has a pending request for file {}",
                        requester.getEmail(), fileId);
                throw new RuntimeException("You already have a pending request for this file");
            } else if (existingRequest.getStatus() == AccessRequest.RequestStatus.APPROVED) {
                log.warn("User {} already has an approved request for file {}",
                        requester.getEmail(), fileId);
                throw new RuntimeException("Your request has already been approved");
            } else if (existingRequest.getStatus() == AccessRequest.RequestStatus.REJECTED) {
                // Si la demande a été rejetée, on peut en créer une nouvelle
                log.info("Updating rejected request to pending for user {}", requester.getEmail());
                existingRequest.setStatus(AccessRequest.RequestStatus.PENDING);
                existingRequest.setMessage(message);
                existingRequest.setRequestedAt(LocalDateTime.now());
                existingRequest.setRespondedAt(null);
                return accessRequestRepository.save(existingRequest);
            }
        }

        // Créer une nouvelle demande
        log.info("Creating new access request for user {} to file {}",
                requester.getEmail(), file.getFileName());

        AccessRequest newRequest = new AccessRequest();
        newRequest.setRequester(requester);
        newRequest.setFile(file);
        newRequest.setOwner(file.getOwner());
        newRequest.setMessage(message);
        newRequest.setStatus(AccessRequest.RequestStatus.PENDING);
        newRequest.setRequestedAt(LocalDateTime.now());

        AccessRequest savedRequest = accessRequestRepository.save(newRequest);
        log.info("Access request created successfully with ID: {}", savedRequest.getId());

        return savedRequest;
    }

    public List<AccessRequest> getRequestsByOwner(User owner) {
        log.info("Getting requests for owner: {}", owner.getEmail());
        List<AccessRequest> requests = accessRequestRepository.findByOwner(owner);
        log.info("Found {} requests for owner {}", requests.size(), owner.getEmail());
        return requests;
    }

    public List<AccessRequest> getRequestsByRequester(User requester) {
        log.info("Getting requests sent by: {}", requester.getEmail());
        List<AccessRequest> requests = accessRequestRepository.findByRequester(requester);
        log.info("Found {} requests sent by {}", requests.size(), requester.getEmail());
        return requests;
    }

    @Transactional
    public AccessRequest updateRequestStatus(Long requestId, User owner, AccessRequest.RequestStatus status) {
        log.info("Updating request {} to status {} by owner {}", requestId, status, owner.getEmail());

        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> {
                    log.error("Request not found with ID: {}", requestId);
                    return new RuntimeException("Request not found with id: " + requestId);
                });

        // Vérifier si l'utilisateur est bien le propriétaire
        if (!request.getOwner().getId().equals(owner.getId())) {
            log.warn("User {} is not authorized to update request {}", owner.getEmail(), requestId);
            throw new RuntimeException("You are not authorized to update this request");
        }

        request.setStatus(status);
        request.setRespondedAt(LocalDateTime.now());

        AccessRequest updatedRequest = accessRequestRepository.save(request);
        log.info("Request {} updated successfully to {}", requestId, status);

        return updatedRequest;
    }

    @Transactional
    public void deleteRequest(Long requestId, User user) {
        log.info("Deleting request {} by user {}", requestId, user.getEmail());

        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> {
                    log.error("Request not found with ID: {}", requestId);
                    return new RuntimeException("Request not found");
                });

        // Vérifier si l'utilisateur est le demandeur ou le propriétaire
        if (!request.getRequester().getId().equals(user.getId()) &&
                !request.getOwner().getId().equals(user.getId())) {
            log.warn("User {} is not authorized to delete request {}", user.getEmail(), requestId);
            throw new RuntimeException("You are not authorized to delete this request");
        }

        accessRequestRepository.delete(request);
        log.info("Request {} deleted successfully", requestId);
    }

    public boolean hasPendingRequest(User user, File file) {
        return accessRequestRepository.existsPendingRequest(file.getId(), user.getId());
    }

    public boolean hasApprovedAccess(Long fileId, Long userId) {
        return accessRequestRepository.findByFileIdAndRequesterId(fileId, userId)
                .map(request -> request.getStatus() == AccessRequest.RequestStatus.APPROVED)
                .orElse(false);
    }

    public boolean hasRequestedAccess(Long fileId, Long userId) {
        return accessRequestRepository.findByFileIdAndRequesterId(fileId, userId)
                .map(request -> request.getStatus() == AccessRequest.RequestStatus.PENDING)
                .orElse(false);
    }
}