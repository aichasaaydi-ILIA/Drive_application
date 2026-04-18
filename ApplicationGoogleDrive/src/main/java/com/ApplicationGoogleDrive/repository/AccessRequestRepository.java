package com.ApplicationGoogleDrive.repository;

import com.ApplicationGoogleDrive.model.AccessRequest;
import com.ApplicationGoogleDrive.model.File;
import com.ApplicationGoogleDrive.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {
    List<AccessRequest> findByRequester(User requester);
    List<AccessRequest> findByOwner(User owner);
    List<AccessRequest> findByFile(File file);
    Optional<AccessRequest> findByRequesterAndFile(User requester, File file);
    List<AccessRequest> findByOwnerAndStatus(User owner, AccessRequest.RequestStatus status);

    @Query("SELECT ar FROM AccessRequest ar WHERE ar.file.id = :fileId")
    List<AccessRequest> findByFileId(@Param("fileId") Long fileId);

    @Query("SELECT ar FROM AccessRequest ar WHERE ar.requester.id = :requesterId")
    List<AccessRequest> findByRequesterId(@Param("requesterId") Long requesterId);

    @Query("SELECT ar FROM AccessRequest ar WHERE ar.owner.id = :ownerId")
    List<AccessRequest> findByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT ar FROM AccessRequest ar WHERE ar.file.id = :fileId AND ar.requester.id = :requesterId")
    Optional<AccessRequest> findByFileIdAndRequesterId(@Param("fileId") Long fileId, @Param("requesterId") Long requesterId);

    @Query("SELECT COUNT(ar) > 0 FROM AccessRequest ar WHERE ar.file.id = :fileId AND ar.requester.id = :requesterId AND ar.status = 'PENDING'")
    boolean existsPendingRequest(@Param("fileId") Long fileId, @Param("requesterId") Long requesterId);


}