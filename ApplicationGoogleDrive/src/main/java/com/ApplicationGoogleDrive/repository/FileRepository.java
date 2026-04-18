package com.ApplicationGoogleDrive.repository;

import com.ApplicationGoogleDrive.model.File;
import com.ApplicationGoogleDrive.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<File, Long> {
    List<File> findByOwner(User owner);
    List<File> findByIsPublicTrue();

    // Tous les fichiers privés
    @Query("SELECT f FROM File f WHERE f.isPublic = false")
    List<File> findAllPrivateFiles();

    // Fichiers visibles pour un utilisateur
    @Query("SELECT f FROM File f WHERE f.isPublic = true " +
            "OR f.owner.id = :userId " +
            "OR EXISTS (SELECT ar FROM AccessRequest ar WHERE ar.file.id = f.id AND ar.requester.id = :userId AND ar.status = 'APPROVED')")
    List<File> findVisibleFiles(@Param("userId") Long userId);

    // NOUVELLE MÉTHODE: Tous les fichiers privés d'autres utilisateurs
    @Query("SELECT f FROM File f WHERE f.isPublic = false AND f.owner.id != :userId")
    List<File> findAllOthersPrivateFiles(@Param("userId") Long userId);

    // Ancienne méthode gardée pour compatibilité
    @Query("SELECT f FROM File f WHERE f.isPublic = false AND f.owner.id != :userId " +
            "AND NOT EXISTS (SELECT ar FROM AccessRequest ar WHERE ar.file.id = f.id AND ar.requester.id = :userId AND ar.status = 'APPROVED')")
    List<File> findOthersPrivateFiles(@Param("userId") Long userId);
}